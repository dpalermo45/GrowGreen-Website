type Opening = {
  slug: string;
  title: string;
  summary?: string;
  employment_type?: string;
  employment_type_label?: string;
  location?: string;
  pay_min?: number | string | null;
  pay_max?: number | string | null;
  pay_unit?: string;
  pay_unit_label?: string;
  incentive?: string | null;
  date_posted?: string;
  closes_on?: string | null;
  requires_technician_screening?: boolean;
};

const OPENINGS_URL = "/api/careers/openings/";
const APPLICATIONS_URL = "/api/careers/applications/";
const SMS_CONSENT =
  "I agree to receive text messages from Grow Green Weed Control about my job application, including interview scheduling and application updates. Message and data rates may apply. Reply STOP to opt out. This is optional and is not consent to marketing.";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const roleCopy: Record<string, { duties: string[]; fit: string[] }> = {
  "lawn-treatment-technician": {
    duties: [
      "Apply scheduled lawn treatments accurately and safely according to labels, routes, and company standards.",
      "Inspect lawns, document conditions, take clear photos, and flag problems that need follow-up.",
      "Communicate professionally with customers and explain what you observed when needed.",
      "Keep your truck, tanks, hoses, tips, and other equipment clean and ready for the next route.",
    ],
    fit: [
      "You are dependable, comfortable working independently, and take pride in consistent results.",
      "You can work outdoors in South Louisiana conditions and handle the physical demands of the route.",
      "You have a valid driver’s license and an insurable driving record.",
      "Experience is helpful, but attention to detail and willingness to learn matter more.",
    ],
  },
  "part-time-office-assistant": {
    duties: [
      "Answer calls and messages, help customers, and keep communication organized and professional.",
      "Schedule services, update work orders, and help the field team stay informed throughout the day.",
      "Record accurate customer notes and assist with straightforward billing or account questions.",
      "Use the CRM, email, and office systems to make sure commitments and follow-ups do not get missed.",
    ],
    fit: [
      "You communicate clearly, stay calm when priorities change, and genuinely enjoy helping people.",
      "You are comfortable with computers and can learn new systems without constant supervision.",
      "You notice details, follow through, and keep information organized.",
      "Experience in a home-service business is useful but not required for the right person.",
    ],
  },
};

function boot() {
  const root = document.getElementById("gg-careers-v3");
  if (!root || root.dataset.ready === "true") return;
  root.dataset.ready = "true";

  const state = {
    openings: [] as Opening[],
    selectedSlug: "",
    currentStep: 0,
    submitting: false,
  };

  const one = <T extends Element = Element>(selector: string, scope: ParentNode = root) =>
    scope.querySelector(selector) as T | null;
  const all = <T extends Element = Element>(selector: string, scope: ParentNode = root) =>
    Array.from(scope.querySelectorAll(selector)) as T[];

  function escapeHtml(value: unknown) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => {
      const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      };
      return map[char] || char;
    });
  }

  function newIdempotencyKey() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `career-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function titleCase(value: string) {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function asNumber(value: unknown) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function money(value: unknown) {
    const number = asNumber(value);
    if (number == null) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: number % 1 ? 2 : 0,
    }).format(number);
  }

  function formatPay(opening: Opening) {
    const min = money(opening.pay_min);
    const max = money(opening.pay_max);
    const unit = String(opening.pay_unit_label || opening.pay_unit || "")
      .replace(/^per\s+/i, "")
      .trim();
    const amount = min && max && min !== max ? `${min}–${max}` : min || max;
    if (!amount) return "Pay discussed during hiring";
    return amount + (unit ? `/${unit.toLowerCase()}` : "");
  }

  function openingList(payload: unknown): Opening[] {
    if (Array.isArray(payload)) return payload as Opening[];
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.openings)) return obj.openings as Opening[];
      if (Array.isArray(obj.results)) return obj.results as Opening[];
    }
    return [];
  }

  function openingBySlug(slug: string) {
    return state.openings.find((o) => o.slug === slug) || null;
  }

  function openingMeta(opening: Opening) {
    const items = [
      formatPay(opening),
      opening.employment_type_label || titleCase(opening.employment_type || ""),
      opening.location || "",
    ];
    return items.filter(Boolean);
  }

  function showMessage(message: string, type: "error" | "info" = "error") {
    const box = one<HTMLElement>("#ggc-form-message");
    if (!box) return;
    box.className = `ggc-form-message ggc-form-message--${type}`;
    box.textContent = message;
    box.hidden = false;
  }

  function clearMessage() {
    const box = one<HTMLElement>("#ggc-form-message");
    if (!box) return;
    box.hidden = true;
    box.textContent = "";
    box.className = "";
  }

  function disableApplication(message: string) {
    const select = one<HTMLSelectElement>("#ggc-job");
    if (select) {
      select.disabled = true;
      select.innerHTML = '<option value="">No open positions</option>';
    }
    const label = one<HTMLElement>("#ggc-selected-role-label");
    if (label) label.textContent = message;
    const form = one<HTMLFormElement>("#ggc-application-form");
    if (form) {
      all<HTMLElement>("input, select, textarea, button", form).forEach((control) => {
        if (!(control instanceof HTMLElement)) return;
        if (!control.matches("[data-prev]")) {
          (control as HTMLInputElement).disabled = true;
        }
      });
    }
    showMessage(message, "info");
  }

  function renderOpenings() {
    const container = one<HTMLElement>("#ggc-openings-list");
    const count = one<HTMLElement>("#ggc-opening-count");
    if (!container || !count) return;
    container.setAttribute("aria-busy", "false");

    if (!state.openings.length) {
      count.textContent = "No positions are open today";
      container.innerHTML =
        '<div class="ggc-openings-message"><h3>No current openings</h3><p>We do not have an active position posted right now. Please check back as Grow Green continues to grow.</p></div>';
      disableApplication("There are no open positions right now.");
      return;
    }

    count.textContent =
      state.openings.length === 1
        ? "1 position currently open"
        : `${state.openings.length} positions currently open`;

    container.innerHTML = state.openings
      .map((opening) => {
        const meta = openingMeta(opening)
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("");
        const incentive = opening.incentive
          ? `<li>${escapeHtml(opening.incentive)}</li>`
          : "";
        return `<article class="ggc-opening-card${
          opening.slug === state.selectedSlug ? " is-selected" : ""
        }" data-opening-card="${escapeHtml(opening.slug)}">
          <div class="ggc-opening-top"><span class="ggc-opening-badge">Now hiring</span></div>
          <h3>${escapeHtml(opening.title)}</h3>
          <p class="ggc-opening-summary">${escapeHtml(
            opening.summary || "Learn more about this opportunity with Grow Green Weed Control.",
          )}</p>
          <ul class="ggc-opening-meta">${meta}${incentive}</ul>
          <div class="ggc-opening-actions">
            <button type="button" class="ggc-button ggc-button--green" data-view-role="${escapeHtml(opening.slug)}">View role</button>
            <button type="button" class="ggc-button ggc-button--ghost" data-apply-role="${escapeHtml(opening.slug)}">Apply</button>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderRolePanel(opening: Opening | null) {
    const panel = one<HTMLElement>("#ggc-role-panel");
    if (!panel) return;
    if (!opening) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }

    const copy = roleCopy[opening.slug];
    const duties = copy
      ? copy.duties
      : [opening.summary || "Role details will be discussed with qualified applicants."];
    const fit = copy
      ? copy.fit
      : [
          "You are dependable, professional, willing to learn, and ready to contribute to a growing local team.",
        ];
    const meta = openingMeta(opening).join(" · ");

    panel.innerHTML = `<div class="ggc-role-panel-head">
        <div><span class="ggc-opening-badge">Role details</span><h3>${escapeHtml(opening.title)}</h3>
        <p>${escapeHtml(meta)}${opening.incentive ? ` · ${escapeHtml(opening.incentive)}` : ""}</p></div>
        <button class="ggc-button" type="button" data-apply-role="${escapeHtml(opening.slug)}">Apply for this role</button>
      </div>
      <div class="ggc-role-columns">
        <div class="ggc-role-column"><h4>What you’ll do</h4><ul class="ggc-check-list">${duties
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}</ul></div>
        <div class="ggc-role-column"><h4>What makes someone successful</h4><ul class="ggc-check-list">${fit
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}</ul></div>
      </div>`;
    panel.hidden = false;
  }

  function renderSchema(openings: Opening[]) {
    const existing = document.getElementById("ggc-dynamic-job-schema");
    if (existing) existing.remove();
    if (!openings.length) return;

    const employmentMap: Record<string, string> = {
      full_time: "FULL_TIME",
      part_time: "PART_TIME",
      seasonal: "TEMPORARY",
      contract: "CONTRACTOR",
    };

    const graph = openings.map((opening) => {
      const job: Record<string, unknown> = {
        "@type": "JobPosting",
        title: opening.title,
        description:
          opening.summary || `Career opportunity with Grow Green Weed Control: ${opening.title}`,
        datePosted: opening.date_posted,
        employmentType: employmentMap[opening.employment_type || ""] || "OTHER",
        directApply: true,
        hiringOrganization: {
          "@type": "Organization",
          name: "Grow Green Weed Control",
          sameAs: "https://growgreenweedcontrol.com/",
          logo: "https://growgreenweedcontrol.com/images/brand/logo.png",
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: "St. Amant",
            addressRegion: "LA",
            addressCountry: "US",
          },
        },
        url: `${window.location.origin}${window.location.pathname}?job=${encodeURIComponent(opening.slug)}#ggc-openings`,
      };
      if (opening.closes_on) job.validThrough = `${opening.closes_on}T23:59:59-05:00`;
      const min = asNumber(opening.pay_min);
      const max = asNumber(opening.pay_max);
      if (min != null || max != null) {
        job.baseSalary = {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: {
            "@type": "QuantitativeValue",
            minValue: min != null ? min : max,
            maxValue: max != null ? max : min,
            unitText: String(opening.pay_unit || "hour").toUpperCase(),
          },
        };
      }
      if (opening.incentive) job.incentiveCompensation = opening.incentive;
      return job;
    });

    const script = document.createElement("script");
    script.id = "ggc-dynamic-job-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(script);
  }

  function populateRoleSelect() {
    const select = one<HTMLSelectElement>("#ggc-job");
    const next = one<HTMLButtonElement>("#ggc-first-next");
    if (!select) return;
    select.innerHTML =
      '<option value="">Select a position</option>' +
      state.openings
        .map(
          (opening) =>
            `<option value="${escapeHtml(opening.slug)}">${escapeHtml(opening.title)}</option>`,
        )
        .join("");
    select.disabled = !state.openings.length;
    if (next) next.disabled = !state.openings.length;
    if (state.selectedSlug) select.value = state.selectedSlug;
  }

  function setTechnicianScreening(opening: Opening | null) {
    const box = one<HTMLElement>("#ggc-tech-screening");
    if (!box) return;
    const controls = all<HTMLSelectElement>("select", box);
    const required = !!(opening && opening.requires_technician_screening);
    box.hidden = !required;
    controls.forEach((control) => {
      control.disabled = !required;
      control.required = required;
      if (!required) {
        control.value = "";
        clearFieldError(control);
      }
    });
  }

  function selectRole(
    slug: string,
    options?: { scrollToRole?: boolean; scrollToForm?: boolean },
  ) {
    const opening = openingBySlug(slug);
    if (!opening) return;
    state.selectedSlug = opening.slug;
    all("[data-opening-card]").forEach((card) => {
      card.classList.toggle(
        "is-selected",
        card.getAttribute("data-opening-card") === opening.slug,
      );
    });
    renderRolePanel(opening);
    const select = one<HTMLSelectElement>("#ggc-job");
    if (select) select.value = opening.slug;
    const label = one<HTMLElement>("#ggc-selected-role-label");
    if (label) label.textContent = opening.title;
    setTechnicianScreening(opening);

    if (options?.scrollToRole) {
      one<HTMLElement>("#ggc-role-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (options?.scrollToForm) {
      setStep(0, false);
      one<HTMLElement>("#ggc-apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => one<HTMLElement>("#ggc-job")?.focus(), 450);
    }
  }

  function showOpeningsError() {
    const container = one<HTMLElement>("#ggc-openings-list");
    if (!container) return;
    container.setAttribute("aria-busy", "false");
    container.innerHTML = `<div class="ggc-openings-message"><h3>Current openings are temporarily unavailable</h3><p>We could not load the hiring list. Please try again, or call <a href="tel:+12254613199">(225) 461-3199</a> if you need assistance.</p><button type="button" class="ggc-button ggc-button--green" id="ggc-retry-openings">Try again</button></div>`;
    const count = one<HTMLElement>("#ggc-opening-count");
    if (count) count.textContent = "Unable to load current openings";
    const label = one<HTMLElement>("#ggc-selected-role-label");
    if (label) label.textContent = "Openings unavailable";
    const select = one<HTMLSelectElement>("#ggc-job");
    if (select) {
      select.disabled = true;
      select.innerHTML = '<option value="">Openings unavailable</option>';
    }
    const next = one<HTMLButtonElement>("#ggc-first-next");
    if (next) next.disabled = true;
  }

  async function loadOpenings() {
    const container = one<HTMLElement>("#ggc-openings-list");
    if (!container) return;
    container.setAttribute("aria-busy", "true");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(OPENINGS_URL, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Openings returned ${response.status}`);
      const payload = await response.json();
      state.openings = openingList(payload).filter((o) => o && o.slug && o.title);

      const params = new URLSearchParams(window.location.search);
      const requested = params.get("job") || params.get("position") || "";
      state.selectedSlug = openingBySlug(requested)
        ? requested
        : state.openings[0]
          ? state.openings[0].slug
          : "";

      renderOpenings();
      populateRoleSelect();
      renderSchema(state.openings);
      if (state.selectedSlug) selectRole(state.selectedSlug);
    } catch {
      showOpeningsError();
    } finally {
      window.clearTimeout(timer);
    }
  }

  const form = one<HTMLFormElement>("#ggc-application-form");
  const steps = all<HTMLElement>("[data-form-step]");
  const pills = all<HTMLElement>("[data-step-pill]");

  function setStep(index: number, focusHeading: boolean) {
    const safeIndex = Math.max(0, Math.min(steps.length - 1, index));
    state.currentStep = safeIndex;
    steps.forEach((step, stepIndex) => {
      step.hidden = stepIndex !== safeIndex;
    });
    pills.forEach((pill, pillIndex) => {
      pill.classList.toggle("is-active", pillIndex === safeIndex);
      pill.classList.toggle("is-complete", pillIndex < safeIndex);
      pill.setAttribute("aria-current", pillIndex === safeIndex ? "step" : "false");
    });
    const bar = one<HTMLElement>("#ggc-progress-bar");
    if (bar) bar.style.width = `${((safeIndex + 1) / steps.length) * 100}%`;
    clearMessage();
    if (focusHeading) {
      const heading = one<HTMLElement>("h3", steps[safeIndex]);
      heading?.focus({ preventScroll: true });
    }
  }

  function fieldErrorNode(control: HTMLElement & { name?: string }) {
    const field =
      control.closest(".ggc-field") ||
      control.closest(".ggc-file-zone") ||
      control.parentElement;
    if (!field || !control.name) return null;
    const existing = field.querySelector(`[data-field-error="${control.name}"]`);
    if (existing) return existing as HTMLElement;
    const node = document.createElement("span");
    node.className = "ggc-field-error";
    node.dataset.fieldError = control.name;
    node.id = `ggc-error-${control.name.replace(/[^a-z0-9_-]/gi, "-")}`;
    node.setAttribute("role", "alert");
    field.appendChild(node);
    return node;
  }

  function setFieldError(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, message: string) {
    const node = fieldErrorNode(control);
    if (node) node.textContent = message;
    control.setAttribute("aria-invalid", "true");
    if (node) control.setAttribute("aria-describedby", node.id);
  }

  function clearFieldError(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) {
    if (!control?.name) return;
    control.removeAttribute("aria-invalid");
    const described = control.getAttribute("aria-describedby");
    if (described?.startsWith("ggc-error-")) control.removeAttribute("aria-describedby");
    root.querySelector(`[data-field-error="${control.name}"]`)?.remove();
    if (typeof control.setCustomValidity === "function") control.setCustomValidity("");
  }

  function validateControl(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
    if (
      !control ||
      control.disabled ||
      control.type === "hidden" ||
      control.type === "button" ||
      control.type === "submit"
    ) {
      return true;
    }
    clearFieldError(control);

    if (control.name === "phone" && control.value) {
      const digits = control.value.replace(/\D/g, "");
      if (digits.length !== 10) {
        setFieldError(control, "Enter a valid 10-digit U.S. phone number.");
        return false;
      }
    }

    if (control.name === "zip" && control.value) {
      const zip = control.value.replace(/\D/g, "");
      if (zip.length !== 5 && zip.length !== 9) {
        setFieldError(control, "Enter a 5-digit ZIP code or ZIP+4.");
        return false;
      }
    }

    if (control.name === "resume" && control instanceof HTMLInputElement && control.files?.[0]) {
      const file = control.files[0];
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!["pdf", "doc", "docx"].includes(extension)) {
        setFieldError(control, "Upload a PDF, DOC, or DOCX file.");
        return false;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFieldError(control, "Your résumé must be 10 MB or smaller.");
        return false;
      }
    }

    if (!control.checkValidity()) {
      const message = control.validity.valueMissing
        ? "This field is required."
        : control.validationMessage || "Check this field and try again.";
      setFieldError(control, message);
      return false;
    }
    return true;
  }

  function controlsForStep(index: number) {
    return all<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea",
      steps[index],
    );
  }

  function validateStep(index: number) {
    let firstInvalid: HTMLElement | null = null;
    controlsForStep(index).forEach((control) => {
      if (!validateControl(control) && !firstInvalid) firstInvalid = control;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function formControlForError(key: string) {
    if (!form) return null;
    const aliases: Record<string, string> = {
      postal_code: "zip",
      start_date: "earliest_start_date",
      experience: "experience_summary",
      good_fit: "why_good_fit",
      drivers_license: "valid_drivers_license",
      driving_record_insurable: "insurable_driving_record",
      essential_functions: "can_perform_essential_functions",
      notes: "additional_notes",
    };
    return (
      (form.elements.namedItem(key) as HTMLInputElement | null) ||
      (form.elements.namedItem(aliases[key]) as HTMLInputElement | null) ||
      null
    );
  }

  function showServerErrors(
    errors: Record<string, string | string[]>,
    fallbackMessage?: string,
  ) {
    let firstControl: HTMLElement | null = null;
    let firstStep = steps.length - 1;
    Object.keys(errors || {}).forEach((key) => {
      const control = formControlForError(key);
      if (!control) return;
      const messages = Array.isArray(errors[key]) ? errors[key] : [errors[key]];
      setFieldError(control, messages.filter(Boolean).join(" ") || "Check this field.");
      const step = control.closest("[data-form-step]");
      const index = step ? steps.indexOf(step as HTMLElement) : -1;
      if (index >= 0 && index < firstStep) {
        firstStep = index;
        firstControl = control;
      } else if (!firstControl) {
        firstControl = control;
      }
    });
    if (firstControl) {
      setStep(firstStep, false);
      window.setTimeout(() => firstControl?.focus(), 40);
    }
    showMessage(fallbackMessage || "Please correct the highlighted fields and try again.", "error");
  }

  function initializeMetadata() {
    const params = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(
      (key) => {
        const target = one<HTMLInputElement>(`#ggc-${key.replace(/_/g, "-")}`);
        if (target) target.value = params.get(key) || "";
      },
    );
    const pageUrl = one<HTMLInputElement>("#ggc-page-url");
    const referrer = one<HTMLInputElement>("#ggc-referrer");
    const device = one<HTMLInputElement>("#ggc-device");
    const idem = one<HTMLInputElement>("#ggc-idempotency");
    const startDate = one<HTMLInputElement>("#ggc-start-date");
    if (pageUrl) pageUrl.value = window.location.href;
    if (referrer) referrer.value = document.referrer || "";
    if (device)
      device.value = navigator.userAgent || (window.innerWidth <= 820 ? "mobile" : "desktop");
    if (idem) idem.value = newIdempotencyKey();
    if (startDate) {
      const today = new Date();
      startDate.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    }
  }

  function setSubmitting(isSubmitting: boolean) {
    state.submitting = isSubmitting;
    const button = one<HTMLButtonElement>("#ggc-submit");
    if (!button) return;
    button.disabled = isSubmitting;
    button.classList.toggle("is-busy", isSubmitting);
    button.textContent = isSubmitting ? "Submitting…" : "Submit application";
  }

  async function submitApplication(event: Event) {
    event.preventDefault();
    if (state.submitting || !form) return;

    let firstInvalidStep = -1;
    for (let i = 0; i < steps.length; i += 1) {
      let valid = true;
      controlsForStep(i).forEach((control) => {
        if (!validateControl(control)) valid = false;
      });
      if (!valid && firstInvalidStep === -1) firstInvalidStep = i;
    }
    if (firstInvalidStep !== -1) {
      setStep(firstInvalidStep, false);
      one<HTMLElement>('[aria-invalid="true"]', steps[firstInvalidStep])?.focus();
      showMessage("Please complete the highlighted fields before submitting.", "error");
      return;
    }

    clearMessage();
    setSubmitting(true);
    const sms = one<HTMLInputElement>("#ggc-sms-opt-in");
    const smsLanguage = one<HTMLInputElement>("#ggc-sms-language");
    if (smsLanguage) smsLanguage.value = sms?.checked ? SMS_CONSENT : "";

    const payload: Record<string, unknown> = {};
    const fd = new FormData(form);
    fd.forEach((value, key) => {
      if (key === "resume" || key === "website") return;
      if (!sms?.checked && (key === "sms_opt_in" || key === "sms_consent_language")) return;
      if (typeof value === "string") payload[key] = value;
    });
    payload.website = String(fd.get("website") || "");

    const resumeInput = one<HTMLInputElement>("#ggc-resume");
    const resumeFile = resumeInput?.files?.[0];
    if (resumeFile) {
      const buffer = await resumeFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
      payload.resume = {
        name: resumeFile.name,
        type: resumeFile.type || "application/octet-stream",
        data_base64: btoa(binary),
      };
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 35_000);

    try {
      const response = await fetch(APPLICATIONS_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const text = await response.text();
      let payload: Record<string, unknown> = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = {};
      }

      if (response.status === 201 && payload.ok === true) {
        const experience = one<HTMLElement>("#ggc-form-experience");
        const success = one<HTMLElement>("#ggc-success");
        if (experience) experience.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus();
          success.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      if (payload.field_errors && typeof payload.field_errors === "object") {
        showServerErrors(
          payload.field_errors as Record<string, string | string[]>,
          typeof payload.error === "string" ? payload.error : undefined,
        );
      } else if (response.status === 429) {
        showMessage(
          "Too many applications were submitted from this connection. Please wait about 15 minutes and try again.",
          "error",
        );
      } else if (response.status === 503) {
        setStep(2, false);
        showMessage(
          "Résumé upload is temporarily unavailable. Remove the résumé and submit again, or try later.",
          "error",
        );
        one<HTMLElement>("#ggc-resume")?.focus();
      } else if (response.status === 403) {
        showMessage("The application could not be accepted from this page. Please refresh and try again.", "error");
      } else {
        showMessage(
          (typeof payload.error === "string" && payload.error) ||
            "We could not submit your application. Please check your information and try again.",
          "error",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        showMessage(
          "The submission took too long. Your information is still here—please try again.",
          "error",
        );
      } else {
        showMessage("We could not reach the hiring system. Check your connection and try again.", "error");
      }
    } finally {
      window.clearTimeout(timer);
      setSubmitting(false);
    }
  }

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const viewButton = target.closest("[data-view-role]");
    const applyButton = target.closest("[data-apply-role]");
    const nextButton = target.closest("[data-next]");
    const previousButton = target.closest("[data-prev]");

    if (viewButton) {
      selectRole(viewButton.getAttribute("data-view-role") || "", { scrollToRole: true });
      return;
    }
    if (applyButton) {
      selectRole(applyButton.getAttribute("data-apply-role") || "", { scrollToForm: true });
      return;
    }
    if (nextButton) {
      if (validateStep(state.currentStep)) setStep(state.currentStep + 1, true);
      return;
    }
    if (previousButton) {
      setStep(state.currentStep - 1, true);
      return;
    }
    if (target.closest("#ggc-retry-openings")) {
      const list = one<HTMLElement>("#ggc-openings-list");
      if (list) {
        list.innerHTML =
          '<div class="ggc-loading-card" aria-hidden="true"></div><div class="ggc-loading-card" aria-hidden="true"></div>';
      }
      void loadOpenings();
    }
  });

  one<HTMLSelectElement>("#ggc-job")?.addEventListener("change", (event) => {
    selectRole((event.target as HTMLSelectElement).value);
  });

  one<HTMLSelectElement>("#ggc-source")?.addEventListener("change", (event) => {
    const wrap = one<HTMLElement>("#ggc-referral-name-wrap");
    if (!wrap) return;
    wrap.hidden = (event.target as HTMLSelectElement).value !== "employee";
    if (wrap.hidden) {
      const name = one<HTMLInputElement>("#ggc-referral-name");
      if (name) name.value = "";
    }
  });

  one<HTMLInputElement>("#ggc-resume")?.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    clearFieldError(input);
    const title = one<HTMLElement>("#ggc-file-title");
    const detail = one<HTMLElement>("#ggc-file-detail");
    if (!file) {
      if (title) title.textContent = "Choose your résumé";
      if (detail) detail.textContent = "PDF, DOC, or DOCX · maximum 10 MB";
      return;
    }
    if (title) title.textContent = file.name;
    if (detail) detail.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    validateControl(input);
  });

  form?.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (target?.name) clearFieldError(target);
  });
  form?.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (target?.name && target.name !== "resume") clearFieldError(target);
  });
  form?.addEventListener("submit", (event) => {
    void submitApplication(event);
  });

  one<HTMLAnchorElement>("#ggc-hero-apply")?.addEventListener("click", (event) => {
    if (!state.openings.length) {
      event.preventDefault();
      one<HTMLElement>("#ggc-openings")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  one<HTMLButtonElement>("#ggc-submit-another")?.addEventListener("click", () => {
    form?.reset();
    all("[data-field-error]").forEach((node) => node.remove());
    all('[aria-invalid="true"]').forEach((control) => control.removeAttribute("aria-invalid"));
    const title = one<HTMLElement>("#ggc-file-title");
    const detail = one<HTMLElement>("#ggc-file-detail");
    if (title) title.textContent = "Choose your résumé";
    if (detail) detail.textContent = "PDF, DOC, or DOCX · maximum 10 MB";
    const experience = one<HTMLElement>("#ggc-form-experience");
    const success = one<HTMLElement>("#ggc-success");
    if (experience) experience.hidden = false;
    if (success) success.hidden = true;
    initializeMetadata();
    populateRoleSelect();
    if (state.selectedSlug) selectRole(state.selectedSlug);
    setStep(0, false);
    one<HTMLElement>("#ggc-form-title")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  initializeMetadata();
  setStep(0, false);
  void loadOpenings();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

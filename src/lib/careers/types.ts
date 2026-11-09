export type CareerOpening = {
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

export type CareersOpeningsResponse = {
  ok: true;
  openings: CareerOpening[];
  mocked?: boolean;
};

export type CareersApplicationSuccess = {
  ok: true;
  mocked?: boolean;
  message?: string;
};

export type CareersApplicationFailure = {
  ok: false;
  error?: string;
  message?: string;
  field_errors?: Record<string, string | string[]>;
};

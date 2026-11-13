CREATE TABLE public.deal_state (
  deal_id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'Not Contacted',
  assigned_partner_id text,
  outcome text CHECK (outcome IN ('Won','Lost')),
  outcome_note text,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.deal_state TO service_role;
ALTER TABLE public.deal_state ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id text NOT NULL,
  type text NOT NULL,
  partner_name text NOT NULL,
  description text NOT NULL,
  user_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id text NOT NULL,
  partner_id text NOT NULL,
  partner_name text NOT NULL,
  channel text NOT NULL,
  replied boolean NOT NULL DEFAULT false,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.outreach TO service_role;
ALTER TABLE public.outreach ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.friction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal text NOT NULL,
  category text NOT NULL,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'New',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.friction_items TO service_role;
ALTER TABLE public.friction_items ENABLE ROW LEVEL SECURITY;
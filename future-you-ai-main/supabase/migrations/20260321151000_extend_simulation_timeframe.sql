-- Extend the simulation timeframe limit from 10 to 50 years to support "FutureMe" long-term projections (e.g., 2040 Vision).

ALTER TABLE public.simulations 
DROP CONSTRAINT IF EXISTS simulations_timeframe_years_check;

ALTER TABLE public.simulations 
ADD CONSTRAINT simulations_timeframe_years_check 
CHECK (timeframe_years >= 1 AND timeframe_years <= 50);

CREATE OR REPLACE FUNCTION public.validate_member_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  _ledger_balance numeric;
  _reserved_amount numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.user_id := auth.uid();
  NEW.status := 'Pending';

  IF NEW.amount IS NULL OR NEW.amount < 500 OR NEW.amount <> trunc(NEW.amount) THEN
    RAISE EXCEPTION 'Withdrawal must be a whole amount of at least 500';
  END IF;
  IF NEW.remarks IS NOT NULL AND char_length(NEW.remarks) > 200 THEN
    RAISE EXCEPTION 'Remarks must be 200 characters or fewer';
  END IF;
  IF NEW.method NOT IN ('Bank', 'UPI') OR jsonb_typeof(NEW.details) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid withdrawal method or payment details';
  END IF;
  IF NEW.method = 'UPI' THEN
    IF coalesce(NEW.details->>'upi_id', '') !~ '^[^[:space:]@]+@[^[:space:]@]+$' OR char_length(NEW.details->>'upi_id') > 200 THEN
      RAISE EXCEPTION 'A valid UPI ID is required';
    END IF;
  ELSE
    IF coalesce(NEW.details->>'account_number', '') = ''
       OR coalesce(NEW.details->>'holder_name', '') = ''
       OR coalesce(NEW.details->>'bank', '') = ''
       OR coalesce(NEW.details->>'ifsc', '') !~* '^[A-Z]{4}0[A-Z0-9]{6}$' THEN
      RAISE EXCEPTION 'Valid bank account details are required';
    END IF;
    IF greatest(
      char_length(coalesce(NEW.details->>'account_number', '')),
      char_length(coalesce(NEW.details->>'holder_name', '')),
      char_length(coalesce(NEW.details->>'bank', '')),
      char_length(coalesce(NEW.details->>'branch', '')),
      char_length(coalesce(NEW.details->>'ifsc', ''))
    ) > 200 THEN
      RAISE EXCEPTION 'Bank details must be 200 characters or fewer';
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));

  SELECT coalesce(sum(CASE WHEN lower(type) = 'credit' THEN amount ELSE -amount END), 0)
  INTO _ledger_balance
  FROM public.wallet_transactions
  WHERE user_id = NEW.user_id;

  SELECT coalesce(sum(amount), 0)
  INTO _reserved_amount
  FROM public.withdrawals
  WHERE user_id = NEW.user_id
    AND status IN ('Pending', 'Approved', 'Paid');

  IF NEW.amount > _ledger_balance - _reserved_amount THEN
    RAISE EXCEPTION 'Withdrawal exceeds the available wallet balance';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_member_withdrawal_before_insert
BEFORE INSERT ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.validate_member_withdrawal();
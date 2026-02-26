-- Function to safely add credits to a consultant's wallet
create or replace function add_credits(p_consultant_id uuid, p_amount int)
returns void as $$
begin
    update credits_wallet
    set balance = balance + p_amount,
        updated_at = now()
    where consultant_id = p_consultant_id;
    
    -- If wallet doesn't exist, create it
    if not found then
        insert into credits_wallet (consultant_id, balance)
        values (p_consultant_id, p_amount);
    end if;
end;
$$ language plpgsql security definer;

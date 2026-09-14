# No voting yet

This branch deliberately does not connect vote buttons to Supabase.

The correct order is:

1. Login works.
2. Profile namespace checks are inspected.
3. Eligibility rule is decided.
4. Users are persisted server-side.
5. Vote writes are enabled.

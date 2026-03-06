-- Réparer le mot de passe de Hamza
UPDATE auth.users
SET encrypted_password = crypt('987654', gen_salt('bf'))
WHERE email = 'Hamza123@gmail.com';

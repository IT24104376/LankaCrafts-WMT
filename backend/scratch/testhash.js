import bcrypt from 'bcryptjs';

const password = 'H12345';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    console.log('--- Generated Hash ---');
    console.log(hash);
});
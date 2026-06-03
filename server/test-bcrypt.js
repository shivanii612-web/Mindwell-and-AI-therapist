import bcrypt from 'bcryptjs';

async function test() {
    const password = 'correct_password';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log('Password:', password);
    console.log('Hash:', hash);

    const match1 = await bcrypt.compare(password, hash);
    console.log('Match (correct):', match1);

    const match2 = await bcrypt.compare('wrong_password', hash);
    console.log('Match (wrong):', match2);

    const match3 = await bcrypt.compare('', hash);
    console.log('Match (empty):', match3);

    const hashForEmpty = await bcrypt.hash('', salt);
    console.log('Hash for empty:', hashForEmpty);
}

test().catch(console.error);

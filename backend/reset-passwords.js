import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://localhost:27017/automation_builder')
  .then(async () => {
    const defaultPassword = 'password123';
    const saltRounds = 12;
    const newHash = await bcrypt.hash(defaultPassword, saltRounds);

    const usersCol = mongoose.connection.db.collection('users');
    const users = await usersCol.find({}).toArray();

    let output = '# User Credentials\n\n| Email | Password | Role |\n|---|---|---|\n';

    for (const u of users) {
      await usersCol.updateOne({ _id: u._id }, { $set: { passwordHash: newHash } });
      output += `| \`${u.email}\` | \`${defaultPassword}\` | ${u.role} |\n`;
    }

    console.log(output);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

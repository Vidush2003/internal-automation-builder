import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/automation_builder')
  .then(async () => {
    // The collection name is usually 'users'
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(JSON.stringify(users.map(u => ({ email: u.email, name: u.name, role: u.role, passwordHash: u.passwordHash })), null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

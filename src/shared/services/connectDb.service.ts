import mongoose from 'mongoose'

async function connectToDB(databaseUri: string): Promise<void> {
  try {
    await mongoose.connect(databaseUri)
    console.log('✅ Database connected')
  } catch (error) {
    console.error('💥 Database connection error:', error)
  }
}

export default connectToDB

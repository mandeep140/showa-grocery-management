import React from 'react'
import Link from 'next/link'

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <p>This is the main page of our application.</p>
      <Link href="/client">Go to Client Page</Link>
    </div>
  )
}

export default Home
// pages/_error.js
import React from 'react'

function Error({ statusCode }) {
  return (
    <div>
      <h1>
        {statusCode} - {statusCode === 404 ? 'Page Not Found' : 'Server-side Error'}
      </h1>
      <p>Sorry, something went wrong on our end.</p>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error

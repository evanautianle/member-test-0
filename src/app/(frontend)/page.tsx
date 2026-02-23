import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <div className="home">
      <div className="content">
        <img
          src="/assets/verylegitclub.jpg"
          alt="Very Legit Club logo"
          style={{ maxWidth: '350px', width: '100%', height: 'auto', display: 'block', margin: '50px auto' }}
        />
        <div className="links">
          <a
            className="button"
            href="/signup"
          >
            Sign Up
          </a>
          <a
            className="button"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Admin panel
          </a>
          <a
            className="button"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  )
}

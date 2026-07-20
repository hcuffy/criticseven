import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import '@mantine/core/styles.css'
import React from 'react'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import 'normalize.css'
import './i18n'
import './index.css'
import Navbar from './ui/Navbar'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>criticseven</title>
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

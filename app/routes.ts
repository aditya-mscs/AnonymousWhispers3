// This file is for reference only as we're using Next.js App Router
// which handles routing differently. This would be used if we were
// using React Router directly.

export const routes = [
  {
    path: "/",
    element: "<RootLayout />",
    children: [
      {
        index: true,
        element: "<HomePage />",
      },
      {
        path: "about",
        element: "<AboutPage />",
      },
      {
        path: "secret/:id",
        element: "<SecretPage />",
      },
    ],
  },
]

// In a Next.js App Router project, routes are defined by the folder structure
// - app/page.tsx -> "/"
// - app/about/page.tsx -> "/about"
// - app/secret/[id]/page.tsx -> "/secret/:id"


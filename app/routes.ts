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


export const api = (path: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
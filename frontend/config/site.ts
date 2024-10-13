export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "CrossChain USDC Loans",
  description:
    "Built using Wormhole",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Circle Wallet",
      href: "/wallet",
    },
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "CCTP Bridge",
      href: "/cctp",
    },
    {
      title: "Wormhole Bridge",
      href: "/wormhole",
    }
  ],
  links: {
    twitter: "https://twitter.com/0xkamal7",
    github: "https://github.com/shadcn/ui",
    docs: "https://ui.shadcn.com",
  },
}

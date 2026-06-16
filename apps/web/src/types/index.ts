export interface Feature {
  title: string
  description: string
  icon: string
}

export interface Metric {
  value: number
  label: string
  suffix?: string
  decimals?: number
}

export interface Testimonial {
  content: string
  author: string
  role: string
  company: string
  type: 'merchant' | 'rider' | 'customer'
}

export interface NavLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

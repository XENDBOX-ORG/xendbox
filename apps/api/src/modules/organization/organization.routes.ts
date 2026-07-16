import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import {
  createOrganization,
  getOrganizationById,
  addOrganizationMember,
  listOrganizationMembers,
} from "./organization.service"
import { AppError } from "../identity/auth.service"

const organizations = new Hono()

organizations.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await c.req.json()
    const org = await createOrganization({ ...body, user_id: user.sub })
    return c.json(org, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

organizations.get("/:id", authMiddleware, async (c) => {
  try {
    const org = await getOrganizationById(c.req.param("id"))
    return c.json(org)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

organizations.post("/:id/members", authMiddleware, async (c) => {
  try {
    const { user_id, role } = await c.req.json()
    const member = await addOrganizationMember({
      organization_id: c.req.param("id"),
      user_id,
      role,
    })
    return c.json(member, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

organizations.get("/:id/members", authMiddleware, async (c) => {
  try {
    const members = await listOrganizationMembers(c.req.param("id"))
    return c.json(members)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default organizations

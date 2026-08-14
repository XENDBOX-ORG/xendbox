import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { requireOrgMember, requireOrgRole } from "../../shared/middleware/org"
import { parseBody } from "../../shared/validate"
import { createOrganization, getOrganizationById, addOrganizationMember, listOrganizationMembers } from "./organization.service"
import { createOrganizationSchema, addMemberSchema } from "@xendbox/validation"
import { AppError } from "../../shared/errors"
import { getParam } from "../../shared/params"

const organizations = new Hono()

organizations.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await parseBody(c, createOrganizationSchema)
    const org = await createOrganization({ ...body, user_id: user.sub })
    return c.json(org, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

organizations.get("/:id", authMiddleware, requireOrgMember, async (c) => {
  try {
    const org = await getOrganizationById(getParam(c, "id"))
    return c.json(org)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

organizations.post("/:id/members", authMiddleware, requireOrgMember, requireOrgRole("OWNER"), async (c) => {
  try {
    const body = await parseBody(c, addMemberSchema)
    const member = await addOrganizationMember({
      organization_id: getParam(c, "id"),
      user_id: body.user_id,
      role: body.role,
    })
    return c.json(member, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

organizations.get("/:id/members", authMiddleware, requireOrgMember, async (c) => {
  try {
    const members = await listOrganizationMembers(getParam(c, "id"))
    return c.json(members)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default organizations

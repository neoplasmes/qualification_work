package domain

// OrgRole is a user's role inside an org
type OrgRole string

const (
	// OrgRoleViewer grants read-only org access
	OrgRoleViewer OrgRole = "viewer"
	// OrgRoleEditor grants edit access inside an org
	OrgRoleEditor OrgRole = "editor"
	// OrgRoleOwner grants owner access inside an org
	OrgRoleOwner OrgRole = "owner"
)

// OrgMembership describes a user's membership in an org
type OrgMembership struct {
	OrgID string
	Name  string
	Role  OrgRole
}

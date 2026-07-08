package org

import (
	"context"
	"fmt"

	"auth/internal/core/domain"
	"auth/internal/core/ports/driven/repos"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TODO: probably bad design??? I have an org repo both in the auth and server services
// Repo is a postgres-based organization repository
type Repo struct {
	pool *pgxpool.Pool
}

// NewPg creates a new postgres-based organization repository
func NewPg(pool *pgxpool.Pool) *Repo {
	return &Repo{
		pool: pool,
	}
}

// FindByUserID returns memberships for a user
func (repo *Repo) FindByUserID(ctx context.Context, userID string) ([]domain.OrgMembership, error) {
	rows, err := repo.pool.Query(
		ctx,
		`SELECT o.id, o.display_name, r.role
		 FROM orgs.roles r
		 JOIN orgs.organizations o ON o.id = r.org_id
		 WHERE r.user_id = $1
		 ORDER BY o.created_at`,
		userID,
	)

	if err != nil {
		return nil, fmt.Errorf("pg.org.FindByUserID: %w", err)
	}
	defer rows.Close()

	memberships := make([]domain.OrgMembership, 0)
	for rows.Next() {
		var membership domain.OrgMembership
		var role string
		if err := rows.Scan(&membership.OrgID, &membership.Name, &role); err != nil {
			return nil, fmt.Errorf("pg.org.FindByUserID scan: %w", err)
		}

		membership.Role = domain.OrgRole(role)
		memberships = append(memberships, membership)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("pg.org.FindByUserID rows: %w", err)
	}

	return memberships, nil
}

var _ repos.OrgRepo = (*Repo)(nil)

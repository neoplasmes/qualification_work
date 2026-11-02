package org

import (
	"context"
	"errors"
	"fmt"

	"auth/internal/adapters/driven/repos/outbox"
	"auth/internal/core/domain"
	"auth/internal/core/ports/driven/repos"

	appErrors "auth/internal/core/errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

const uniqueViolation = "23505"

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

// FindRole returns the user's role in the org, empty if the user is not a member
func (repo *Repo) FindRole(ctx context.Context, orgID string, userID string) (domain.OrgRole, error) {
	var role string

	err := repo.pool.QueryRow(
		ctx,
		`SELECT role FROM orgs.roles WHERE org_id = $1 AND user_id = $2`,
		orgID, userID,
	).Scan(&role)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("pg.org.FindRole: %w", err)
	}

	return domain.OrgRole(role), nil
}

// Create inserts the org with an owner membership and an OrgCreated event
func (repo *Repo) Create(ctx context.Context, params repos.OrgCreateParams) (string, error) {
	var orgID string

	err := pgx.BeginFunc(ctx, repo.pool, func(tx pgx.Tx) error {
		var err error
		orgID, err = InsertWithOwner(ctx, tx, params)

		return err
	})
	if err != nil {
		return "", fmt.Errorf("pg.org.Create: %w", err)
	}

	return orgID, nil
}

// Delete removes the org, memberships cascade, and writes an OrgDeleted event
func (repo *Repo) Delete(ctx context.Context, orgID string) (bool, error) {
	deleted := false

	err := pgx.BeginFunc(ctx, repo.pool, func(tx pgx.Tx) error {
		tag, err := tx.Exec(ctx, `DELETE FROM orgs.organizations WHERE id = $1`, orgID)
		if err != nil {
			return fmt.Errorf("delete: %w", err)
		}
		if tag.RowsAffected() == 0 {
			return nil
		}

		deleted = true

		if err := outbox.WriteOrgEvent(ctx, tx, outbox.OrgDeleted, orgID, struct{}{}); err != nil {
			return fmt.Errorf("org deleted event: %w", err)
		}

		return nil
	})
	if err != nil {
		return false, fmt.Errorf("pg.org.Delete: %w", err)
	}

	return deleted, nil
}

// InsertWithOwner creates an org, its owner role and the OrgCreated event within tx
func InsertWithOwner(ctx context.Context, tx pgx.Tx, params repos.OrgCreateParams) (string, error) {
	var orgID string

	err := tx.QueryRow(
		ctx,
		`INSERT INTO orgs.organizations (name, display_name, owner_id)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		params.Name, params.DisplayName, params.OwnerID,
	).Scan(&orgID)

	var pgError *pgconn.PgError
	if errors.As(err, &pgError) && pgError.Code == uniqueViolation {
		return "", appErrors.Conflict("organization name already exists")
	}
	if err != nil {
		return "", fmt.Errorf("insert org: %w", err)
	}

	if _, err := tx.Exec(
		ctx,
		`INSERT INTO orgs.roles (org_id, user_id, role) VALUES ($1, $2, 'owner')`,
		orgID, params.OwnerID,
	); err != nil {
		return "", fmt.Errorf("insert owner role: %w", err)
	}

	if err := outbox.WriteOrgEvent(ctx, tx, outbox.OrgCreated, orgID, outbox.OrgCreatedPayload{
		Name:        params.Name,
		DisplayName: params.DisplayName,
		OwnerID:     params.OwnerID,
	}); err != nil {
		return "", fmt.Errorf("org created event: %w", err)
	}

	return orgID, nil
}

var _ repos.OrgRepo = (*Repo)(nil)

package driving

import "context"

// Executable describes a command/query use case with typed input and output
type Executable[I any, O any] interface {
	// Execute runs the use case
	Execute(ctx context.Context, args I) (O, error)
}

package driving

// Executable driving port-interface for all read/write operations.
// Thus, all read and write core business logic operations must implement it.
type Executable[I any, O any] interface {
	// Execute method to execute an operation
	Execute(args I) (O, error)
}
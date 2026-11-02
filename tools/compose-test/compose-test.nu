# wrapped so flags of the wrapped command are passed through untouched
def --wrapped main [composeFile: path, executable: string, ...arguments: string] {
    let composePath = $composeFile | path expand
    let down = $'docker compose -f "($composePath)" down -v --rmi local --remove-orphans --timeout 2'

    # leftovers of a run killed before the watcher existed
    do { ^sh -c $down } | complete | ignore

    # nu cannot trap signals, so a detached watcher removes the stack as soon as this process dies,
    # including Ctrl+C, timeouts and kills that never reach the cleanup below
    ^setsid -f sh -c $'while kill -0 ($nu.pid) 2>/dev/null; do sleep 1; done; ($down) >/dev/null 2>&1'

    let startup = do { ^docker compose -f $composeFile up -d --force-recreate --renew-anon-volumes --build --wait --wait-timeout 300 } | complete
    print --no-newline $startup.stdout
    print --stderr --no-newline $startup.stderr

    mut result = $startup.exit_code
    if $result == 0 {
        let suite = try {
            do { ^$executable ...$arguments } | complete
        } catch {|failure|
            {stdout: '', stderr: $failure.msg, exit_code: 1}
        }
        print --no-newline $suite.stdout
        print --stderr --no-newline $suite.stderr
        $result = $suite.exit_code
    }

    let cleanup = do { ^docker compose -f $composeFile down -v --rmi local } | complete
    print --no-newline $cleanup.stdout
    print --stderr --no-newline $cleanup.stderr

    if $result != 0 { exit $result }
    exit $cleanup.exit_code
}

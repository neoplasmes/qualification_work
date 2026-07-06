def main [composeFile: path, executable: string, ...arguments: string] {
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

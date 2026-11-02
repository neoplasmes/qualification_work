# validate compose configurations and their bind sources without starting containers
def main [] {
    let database = 'env/local/docker-compose.database.yaml'
    let cache = 'env/local/docker-compose.cache.yaml'
    let broker = 'env/local/docker-compose.broker.yaml'

    let configurations = [
        [$database $cache $broker]
        [$database]
        [$cache]
        [$broker]
        [apps/client/docker-compose.dev.yaml]
        [apps/auth/docker-compose.test.yaml]
        [e2e/docker-compose/docker-compose.yaml]
        [e2e/backend/docker-compose/docker-compose.yaml]
    ]

    for files in $configurations {
        let args = $files | each {|file| ['-f' $file] } | flatten
        let result = ^docker compose ...$args config --format json | complete

        if $result.exit_code != 0 {
            error make {msg: $result.stderr}
        }

        let config = $result.stdout | from json
        for service in ($config.services | values) {
            for volume in ($service.volumes? | default [] | where type == bind) {
                if not ($volume.source | path exists) {
                    error make {msg: $'missing bind source: ($volume.source)'}
                }
            }
        }
    }
}

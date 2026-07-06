def main [...files: path] {
    for file in $files {
        if not (nu-check ($file | path expand)) {
            error make {msg: $'invalid Nushell script: ($file)'}
        }
    }
}

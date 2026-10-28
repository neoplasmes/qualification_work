def main [...imageDirs: string] {
    for imageDir in $imageDirs {
        build $imageDir
    }
}

# builds one application image and pushes it to the registry
def build [imageDir: string] {
    let directory = $imageDir | str trim --right --char '/'

    if $directory == '' or ($directory | path parse | get parent | str starts-with '/') or ($directory | str starts-with '/') or ($directory | str contains '..') or not ($directory | path exists) {
        error make {msg: 'expected a workspace-relative directory containing a Dockerfile'}
    }

    let dockerfile = $directory | path join Dockerfile
    if not ($dockerfile | path exists) {
        error make {msg: $'Dockerfile not found: ($dockerfile)'}
    }

    let imageName = $directory | str replace --all '/' '_'
    let image = $'ghcr.io/neoplasmes/qualification_work/($imageName):custom'

    ^docker build --progress=tty -f $dockerfile -t $image --label org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work --push .
}

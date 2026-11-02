def main [jobFile: path, sqlDir: path] {
    if not ($jobFile | path exists) or not ($sqlDir | path exists) or ($sqlDir | path type) != dir {
        error make {msg: 'expected an existing job file and SQL directory'}
    }

    let job = open $jobFile
    let jobName = $job.metadata.name? | default ''
    let namespace = $job.metadata.namespace? | default ''
    let configmaps = $job.spec.template.spec.volumes? | default [] | where {|volume| $volume.configMap.name? != null }

    if $jobName == '' or $namespace == '' or ($configmaps | length) != 1 {
        error make {msg: 'job requires metadata.name, metadata.namespace and exactly one configMap volume'}
    }

    let configmapName = $configmaps.0.configMap.name
    ^kubectl -n $namespace delete job $jobName --ignore-not-found --wait=true
    let configmap = ^kubectl -n $namespace create configmap $configmapName $'--from-file=($sqlDir)' --dry-run=client -o yaml
    $configmap | ^kubectl apply -f -
    ^kubectl apply -f $jobFile
    ^kubectl -n $namespace wait --for=condition=complete $'job/($jobName)' --timeout=-1s
    ^kubectl -n $namespace logs $'job/($jobName)'
    ^kubectl -n $namespace delete configmap $configmapName --ignore-not-found
}

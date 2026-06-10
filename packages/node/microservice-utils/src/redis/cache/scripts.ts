export const setTaggedScript = `
redis.call('SET', KEYS[1], ARGV[1], 'PX', tonumber(ARGV[2]))
local tagTtlMs = tonumber(ARGV[2]) + 60000
for i = 3, #ARGV do
    redis.call('SADD', ARGV[i], KEYS[1])
    redis.call('PEXPIRE', ARGV[i], tagTtlMs)
end
return 1
`;

export const invalidateTagsScript = `
local deleted = 0
for i = 1, #KEYS do
    local members = redis.call('SMEMBERS', KEYS[i])
    for j = 1, #members do
        redis.call('UNLINK', members[j])
        deleted = deleted + 1
    end
    redis.call('DEL', KEYS[i])
end
return deleted
`;

export const unlockScript = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
`;

For the running of tests the following command has to be applied: <br/>
`chmod 644 /home/neoplasmes/qualification_work/apps/go/auth/test/integration/keys/jwt.pem`<br/>
Because auth service runs in nonroot image

### Roadmap:
- [ ] Implement redis cache strategy for `/me` route
- [ ] Implement event or message publishing in redis for the creation of default user organization and other default things
- [ ] Add observability
- [ ] Add sidecar circuit breaking and rate limiting (and before - think if we actually need it)
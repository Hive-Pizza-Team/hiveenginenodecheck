# hiveenginenodecheck

Monitor API node and RPC status of Hive-Engine node network.

# Current notifications

* nodes miss a round / recover
* 500+ blocks behind / caught up
* low resource credits (which also causes missed rounds) / recharged
* node disabled/enabled
* new node added

# Future work

Add notifications for:
* any front-end site is down
* api node RPC is down (unreachable)
* any node is diverged from consensus
* side-chain is behind on blocks

The list of nodes can be dynamic (fetch from on-chain data)

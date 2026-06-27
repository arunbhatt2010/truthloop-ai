/*
==================================================
Foundation Testing Engine v2
Block 01 : Constructor
Version : 2.0.0
Status : COMPLETE
==================================================

Purpose

Initialize complete engine state.

This block contains only engine state.

No business logic.

No request logic.

No report logic.

==================================================
*/

class TestingEngine {

    constructor() {

        /* ==========================
           ENGINE
        ========================== */

        this.name = "Foundation Testing Engine";

        this.version = "2.0.0";

        this.status = "IDLE";



        /* ==========================
           SESSION
        ========================== */

        this.session = {

            id: null,

            active: false,

            startedAt: null,

            finishedAt: null

        };



        /* ==========================
           TARGET ENDPOINT
        ========================== */

        this.endpoint = null;

        this.endpointValidated = false;



        /* ==========================
           USER SETTINGS
        ========================== */

        this.selectedUsers = null;

        this.trafficProfile = null;



        /* ==========================
           RUNTIME
        ========================== */

        this.isRunning = false;

        this.progress = 0;



        /* ==========================
           CONFIGURATION
        ========================== */

        this.config = {

            timeout: 15000,

            retryLimit: 1,

            batchSize: 50,

            maxUsers: 1000,

            allowCustomUsers: true

        };



        /* ==========================
           REQUEST CACHE
        ========================== */

        this.requests = [];

        this.responses = [];



        /* ==========================
           METRICS
        ========================== */

        this.metrics = {

            requestedUsers: 0,

            completedUsers: 0,

            failedUsers: 0,

            successRate: 0,

            averageLatency: 0,

            minimumLatency: 0,

            maximumLatency: 0,

            p95Latency: 0,

            throughput: 0,

            timeoutCount: 0,

            serverErrors: 0,

            networkErrors: 0,

            queueDepth: 0,

            peakConcurrency: 0,

            duration: 0

        };



        /* ==========================
           REPORT
        ========================== */

        this.lastReport = null;



        /* ==========================
           RECOMMENDATIONS
        ========================== */

        this.recommendations = [];



        /* ==========================
           DEBUG
        ========================== */

        this.debug = [];

    }

}

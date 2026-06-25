/**
 * ============================================================
 * SignalCollector.js
 * TruthLoop AI
 * ------------------------------------------------------------
 * Collects raw community signals from different sources.
 * No analysis is performed here.
 * ============================================================
 */

class SignalCollector {

  async collect(context = {}) {

  const sources = [

    await this.collectLinkedIn(context),
    await this.collectReddit(context),
    await this.collectX(context),
    await this.collectFacebook(context),
    await this.collectDiscord(context),
    await this.collectWebsite(context)

  ];

  const normalized =
    this.normalizeSignals(sources.flat());

const validated =
    this.validateSignals(normalized);

const unique =
    this.removeDuplicateSignals(validated);

const prioritized =
    this.prioritizeSignals(unique);

const filtered =
    this.filterSpamSignals(prioritized);

const stats =
    this.getCollectionStats(filtered);

// Future use
// console.log(stats);

return filtered;
  }
  async collectLinkedIn(context = {}) {

    if (!context.linkedin) {
        return [];
    }

    return context.linkedin.map(post => ({

        platform: "linkedin",

        type: post.type || "post",

        author: post.author || "unknown",

        text: post.text || "",

        timestamp: post.timestamp || null,

        metadata: {
            likes: post.likes || 0,
            comments: post.comments || 0,
            url: post.url || null
        }

    }));

  }

  async collectReddit(context = {}) {

    if (!context.reddit) {
        return [];
    }

    return context.reddit.map(post => ({

        platform: "reddit",

        type: post.type || "post",

        author: post.author || "unknown",

        text: post.text || "",

        timestamp: post.timestamp || null,

        metadata: {
            upvotes: post.upvotes || 0,
            comments: post.comments || 0,
            subreddit: post.subreddit || null,
            url: post.url || null
        }

    }));

      }

  async collectX(context = {}) {

    if (!context.x) {
        return [];
    }

    return context.x.map(post => ({

        platform: "x",

        type: post.type || "post",

        author: post.author || "unknown",

        text: post.text || "",

        timestamp: post.timestamp || null,

        metadata: {
            likes: post.likes || 0,
            reposts: post.reposts || 0,
            url: post.url || null
        }

    }));

  }

  async collectFacebook(context = {}) {

    if (!context.facebook) {
        return [];
    }

    return context.facebook.map(post => ({

        platform: "facebook",

        type: post.type || "post",

        author: post.author || "unknown",

        text: post.text || "",

        timestamp: post.timestamp || null,

        metadata: {
            reactions: post.reactions || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            url: post.url || null
        }

    }));

          }

  async collectDiscord(context = {}) {

    if (!context.discord) {
        return [];
    }

    return context.discord.map(message => ({

        platform: "discord",

        type: "message",

        author: message.author || "unknown",

        text: message.text || "",

        timestamp: message.timestamp || null,

        metadata: {
            server: message.server || null,
            channel: message.channel || null
        }

    }));

      }

  async collectWebsite(context = {}) {

    if (!context.website) {
        return [];
    }

    return context.website.map(item => ({

        platform: "website",

        type: item.type || "page",

        author: item.author || "system",

        text: item.text || "",

        timestamp: item.timestamp || null,

        metadata: {
            url: item.url || null,
            source: item.source || "website"
        }

    }));

      }
}
normalizeSignals(signals = []) {

  return signals
    .filter(Boolean)
    .map(signal => ({

      platform: signal.platform || "unknown",

      type: signal.type || "unknown",

      author: signal.author || "anonymous",

      text: signal.text || "",

      timestamp: signal.timestamp || null,

      metadata: signal.metadata || {}

    }));

}
validateSignals(signals = []) {

    return signals.filter(signal => {

        if (!signal) return false;

        if (!signal.platform) return false;

        if (!signal.text) return false;

        if (signal.text.trim().length === 0) return false;

        return true;

    });

}
removeDuplicateSignals(signals = []) {

    const seen = new Set();

    return signals.filter(signal => {

        const key = [
            signal.platform,
            signal.author,
            signal.text
        ].join("|");

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;

    });

                          }
  prioritizeSignals(signals = []) {

    return signals.map(signal => {

        let priority = "LOW";
        let score = 1;

        const text = signal.text.toLowerCase();

        if (
            text.includes("problem") ||
            text.includes("issue") ||
            text.includes("need") ||
            text.includes("help")
        ) {
            priority = "MEDIUM";
            score = 5;
        }

        if (
            text.includes("urgent") ||
            text.includes("can't") ||
            text.includes("frustrated") ||
            text.includes("stuck")
        ) {
            priority = "HIGH";
            score = 10;
        }

        return {
            ...signal,
            priority,
            score
        };

    });

          }
  filterSpamSignals(signals = []) {

    const spamWords = [
        "buy now",
        "click here",
        "free money",
        "subscribe",
        "winner",
        "earn fast"
    ];

    return signals.filter(signal => {

        const text = signal.text.toLowerCase();

        return !spamWords.some(word =>
            text.includes(word)
        );

    });

    }
  handleCollectionError(source, error) {

    console.error(
        `[SignalCollector] ${source}`,
        error
    );

    return [];

  }
  getCollectionStats(signals = []) {

    return {

        total: signals.length,

        byPlatform: signals.reduce(
            (stats, signal) => {

                stats[
                    signal.platform
                ] =
                    (stats[
                        signal.platform
                    ] || 0) + 1;

                return stats;

            },
            {}
        )

    };

  }
export default SignalCollector;

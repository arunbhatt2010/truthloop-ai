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

  return this.normalizeSignals(
    sources.flat()
  );

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

module.exports = SignalCollector;

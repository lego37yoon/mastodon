# frozen_string_literal: true

class PrecomputeFeedService < BaseService
  include Redisable

  def call(account)
    FeedManager.instance.populate_home(account)
  ensure
    HomeFeed.new(account).regeneration_finished!
  end

  private

  def skip_timeline?(type, id)
    @skip_filled_timelines && FeedManager.instance.timeline_size(type, id) * 2 > FeedManager::MAX_ITEMS
  end
end

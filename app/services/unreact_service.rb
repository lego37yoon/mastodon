# frozen_string_literal: true

class UnreactService < BaseService
  include Payloadable

  def call(account, status, emoji)
    name, domain = emoji.split('@', 2)
    custom_emoji = if domain.present?
                     CustomEmoji.find_by(shortcode: name, domain: domain)
                   else
                     CustomEmoji.find_by(shortcode: name, domain: nil)
                   end

    reaction =
      if domain.present?
        return if custom_emoji.nil?

        StatusReaction.find_by(account: account, status: status, name: name, custom_emoji: custom_emoji)
      else
        StatusReaction.find_by(account: account, status: status, name: name, custom_emoji: custom_emoji) ||
          StatusReaction.find_by(account: account, status: status, name: name, custom_emoji: nil)
      end

    return if reaction.nil?

    reaction.destroy!
    create_notification(reaction) if !status.account.local? && status.account.activitypub?
    reaction
  end

  private

  def create_notification(reaction)
    status = reaction.status
    ActivityPub::DeliveryWorker.perform_async(build_json(reaction), reaction.account_id, status.account.inbox_url)
  end

  def build_json(reaction)
    Oj.dump(serialize_payload(reaction, ActivityPub::UndoEmojiReactionSerializer))
  end
end

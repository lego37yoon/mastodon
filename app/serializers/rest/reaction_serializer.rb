# frozen_string_literal: true

class REST::ReactionSerializer < ActiveModel::Serializer
  include RoutingHelper

  attributes :name, :count, :reacted_by

  attribute :me, if: :current_user?
  attribute :url, if: :custom_emoji?
  attribute :static_url, if: :custom_emoji?

  def count
    object.respond_to?(:count) ? object.count : 0
  end

  def current_user?
    !current_user.nil?
  end

  def custom_emoji?
    object.custom_emoji.present?
  end

  def name
    if extern?
      [object.name, '@', object.custom_emoji.domain].join
    else
      object.name
    end
  end

  def url
    full_asset_url(object.custom_emoji.image.url)
  end

  def static_url
    full_asset_url(object.custom_emoji.image.url(:static))
  end

  def reacted_by
    reactions.map do |reaction|
      account = reaction.account
      {
        id: account.id.to_s,
        username: account.username,
        acct: account.pretty_acct,
        display_name: account.unavailable? ? '' : account.display_name,
        display_name_html: ERB::Util.html_escape(account_display_name(account)).to_s,
        url: ActivityPub::TagManager.instance.url_for(account) || ActivityPub::TagManager.instance.uri_for(account),
        avatar: full_asset_url(account.unavailable? ? account.avatar.default_url : account.avatar_original_url),
        avatar_static: full_asset_url(account.unavailable? ? account.avatar.default_url : account.avatar_static_url),
        emojis: account.unavailable? ? [] : account.emojis.map { |emoji| serialized_emoji(emoji) },
        is_cat: account.unavailable? ? false : account.is_cat,
      }
    end
  end

  private

  def extern?
    custom_emoji? && object.custom_emoji.domain.present?
  end

  def reactions
    @reactions ||= begin
      if object.respond_to?(:status_id)
        ::StatusReaction.where(status_id: object.status_id, name: object.name, custom_emoji_id: object.custom_emoji_id)
      elsif object.respond_to?(:announcement_id)
        ::AnnouncementReaction.where(announcement_id: object.announcement_id, name: object.name, custom_emoji_id: object.custom_emoji_id)
      else
        ::StatusReaction.none
      end
        .includes(:account)
        .to_a
    end
  end

  def account_display_name(account)
    account.display_name.presence || account.username
  end

  def serialized_emoji(emoji)
    {
      shortcode: emoji.shortcode,
      url: full_asset_url(emoji.image.url),
      static_url: full_asset_url(emoji.image.url(:static)),
      visible_in_picker: emoji.visible_in_picker,
    }
  end
end

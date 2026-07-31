# frozen_string_literal: true

class MigrateSmoreThemes < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  class User < ApplicationRecord; end
  class Setting < ApplicationRecord; end

  THEME_MAPPINGS = {
    'ridibatang-light' => %w(ridibatang light auto),
    'ridibatang-dark' => %w(ridibatang dark auto),
    'maruburi-light' => %w(maruburi light auto),
    'maruburi-dark' => %w(maruburi dark auto),
    'mastodon-light' => %w(default light auto),
    'contrast' => %w(default dark high),
  }.freeze

  def up
    migrate_users
    migrate_site_theme
  end

  def down; end

  private

  def migrate_users
    User.where.not(settings: nil).find_each do |user|
      settings = JSON.parse(user.attributes_before_type_cast['settings'])
      mapping = THEME_MAPPINGS[settings&.fetch('theme', nil)]
      next unless mapping

      settings['theme'], settings['web.color_scheme'], settings['web.contrast'] = mapping
      user.update_column('settings', JSON.generate(settings))
    end
  end

  def migrate_site_theme
    setting = Setting.find_by(var: 'theme')
    return if setting&.attributes&.fetch('value', nil).blank?

    theme = YAML.safe_load(setting.attributes['value'], permitted_classes: [ActiveSupport::HashWithIndifferentAccess, Symbol])
    mapped_theme = THEME_MAPPINGS.fetch(theme, [theme]).first
    return if mapped_theme == theme

    setting.update_column('value', mapped_theme.to_yaml)
  end
end

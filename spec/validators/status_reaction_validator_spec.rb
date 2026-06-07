# frozen_string_literal: true

require 'rails_helper'

RSpec.describe StatusReactionValidator do
  let(:account) { Fabricate(:account) }
  let(:status) { Fabricate(:status, account: account) }

  describe '#validate' do
    it 'adds an error when custom emoji is from another domain' do
      remote_emoji = Fabricate(:custom_emoji, domain: 'example.com')
      reaction = status.status_reactions.build(name: remote_emoji.shortcode, custom_emoji: remote_emoji)

      subject.validate(reaction)

      expect(reaction.errors[:name]).to include(I18n.t('reactions.errors.unrecognized_emoji'))
    end

    it 'does not add an error when custom emoji is local' do
      local_emoji = Fabricate(:custom_emoji)
      reaction = status.status_reactions.build(name: local_emoji.shortcode, custom_emoji: local_emoji)

      subject.validate(reaction)

      expect(reaction.errors).to be_empty
    end
  end
end

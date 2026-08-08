# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ActivityPub::Activity::Like do
  let(:sender)    { Fabricate(:remote_account, domain: 'example.com') }
  let(:recipient) { Fabricate(:account) }
  let(:status)    { Fabricate(:status, account: recipient) }

  let(:json) do
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: 'foo',
      type: 'Like',
      actor: ActivityPub::TagManager.instance.uri_for(sender),
      object: ActivityPub::TagManager.instance.uri_for(status),
    }.with_indifferent_access
  end

  describe '#perform' do
    subject { described_class.new(json, sender) }

    context 'with a regular Like' do
      before do
        subject.perform
      end

      it 'creates a favourite from sender to status' do
        expect(sender.favourited?(status)).to be true
      end
    end

    context 'with a Misskey custom emoji reaction' do
      let(:emoji_url) { 'https://example.com/emoji/blobcat.png' }
      let!(:custom_emoji) do
        Fabricate(:custom_emoji, domain: sender.domain, shortcode: 'blobcat').tap do |emoji|
          emoji.update_column(:image_remote_url, emoji_url) # Bypass the remote attachment downloader in this unit spec
        end
      end

      let(:json) do
        super().merge(
          content: ':blobcat:',
          _misskey_reaction: ':blobcat:',
          tag: [
            {
              type: 'Emoji',
              id: 'https://example.com/emojis/blobcat',
              name: ':blobcat:',
              icon: {
                url: emoji_url,
              },
            },
          ]
        ).with_indifferent_access
      end

      it 'creates a status reaction with the remote custom emoji' do
        expect { subject.perform }
          .to change(StatusReaction, :count).by(1)

        expect(status.status_reactions.last).to have_attributes(
          account: sender,
          name: 'blobcat',
          custom_emoji: custom_emoji
        )
      end

      it 'does not create a favourite' do
        subject.perform

        expect(sender.favourited?(status)).to be false
      end

      context 'when the custom emoji belongs to another domain' do
        let(:json) do
          super().tap do |payload|
            payload[:tag].first[:id] = 'https://other.example/emojis/blobcat'
          end.with_indifferent_access
        end

        it 'does not create a status reaction with the custom emoji' do
          expect { subject.perform }
            .to_not change(StatusReaction, :count)
        end

        it 'creates a favourite instead' do
          subject.perform

          expect(sender.favourited?(status)).to be true
        end
      end
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe REST::ReactionSerializer do
  subject { serialized_record_json(reaction, described_class, options: { scope: reactor_a }) }

  let(:status) { Fabricate(:status, account: Fabricate(:account, username: 'status-author')) }
  let(:reactor_a) { Fabricate(:account, username: 'alice', display_name: 'Alice Reacts') }
  let(:reactor_b) { Fabricate(:account, username: 'bob', display_name: 'Bob Reacts') }
  let(:reaction) do
    status.status_reactions.create!(account: reactor_a, name: '👍')
    status.status_reactions.create!(account: reactor_b, name: '👍')
    status.reactions.first
  end

  it 'includes full reacted_by list for the reaction' do
    expect(subject['reacted_by']).to contain_exactly(hash_including(
                                                       'id' => reactor_a.id.to_s,
                                                       'nickname' => reactor_a.display_name,
                                                       'profile_url' => ActivityPub::TagManager.instance.url_for(reactor_a),
                                                       'avatar_url' => reactor_a.avatar_static_url
                                                     ), hash_including(
                                                          'id' => reactor_b.id.to_s,
                                                          'nickname' => reactor_b.display_name,
                                                          'profile_url' => ActivityPub::TagManager.instance.url_for(reactor_b),
                                                          'avatar_url' => reactor_b.avatar_static_url
                                                        ))
  end
end

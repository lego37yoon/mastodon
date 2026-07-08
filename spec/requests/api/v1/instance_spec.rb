# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Instances' do
  let(:user)    { Fabricate(:user) }
  let(:token)   { Fabricate(:accessible_access_token, resource_owner_id: user.id) }
  let(:headers) { { 'Authorization' => "Bearer #{token.token}" } }

  describe 'GET /api/v1/instance' do
    context 'when not logged in' do
      it 'returns http success and json' do
        get api_v1_instance_path

        expect(response)
          .to have_http_status(200)
        expect(response.content_type)
          .to start_with('application/json')

        expect(response.parsed_body)
          .to be_present
          .and include(title: 'Mastodon')
          .and include(
            configuration: include(
              statuses: include(
                max_characters: StatusLengthValidator::MAX_CHARS,
                max_media_attachments: Status::MEDIA_ATTACHMENTS_LIMIT,
                characters_reserved_per_url: StatusLengthValidator::URL_PLACEHOLDER_CHARS
              )
            )
          )
      end
    end

    context 'when logged in' do
      it 'returns http success and json' do
        get api_v1_instance_path, headers: headers

        expect(response)
          .to have_http_status(200)
        expect(response.content_type)
          .to start_with('application/json')

        expect(response.parsed_body)
          .to be_present
          .and include(title: 'Mastodon')
      end
    end
  end
end

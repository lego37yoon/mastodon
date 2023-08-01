# frozen_string_literal: true

class TranslationService::Papago < TranslationService
  include JsonLdHelper

  def initialize(api_id, api_secret)
    super()

    @api_id    = api_id
    @api_secret = api_secret
  end

  def translate(text, source_language, target_language)
    request(text, source_language, target_language).perform do |res|
      case res.code
      when 429
        raise TooManyRequestsError
      when 400
        transform_response(res.body_with_limit)
      when 500
        transform_response(res.body_with_limit)
      when 200...300
        transform_response(res.body_with_limit)
      else
        raise UnexpectedResponseError
      end
    end
  end

  private

  def request(text, source_language, target_language)
    req = Request.new(:post, 'https://openapi.naver.com/v1/papago/n2mt', form: {source: source_language, target: target_language, text: text})
    req.add_headers('Content-Type': "application/json; charset=UTF-8")
    req.add_headers('X-Naver-Client-Id': "#{@api_id}")
    req.add_headers('X-Naver-Secret': "#{@api_secret}")
    req
  end

  def transform_response(str)
    json = Oj.load(str, mode: :strict)

    unless json.is_a?(Hash)
      Translation.new(text: json.dig('resultText', 'errorMessage'), detected_source_language: json.dig('resultText', 'errorCode'), provider: 'NAVER Papago')
    else
      Translation.new(text: json.dig('message', 'result', 'translatedText'), detected_source_language: json.dig('message', 'result', 'srcLangType'), provider: 'NAVER Papago')
    end
  rescue Oj::ParseError
    raise UnexpectedResponseError
  end
end

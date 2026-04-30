namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;

public class AggregatedSurveyResultsDto
{
    public Guid CampaignId { get; set; }
    public int TotalRespondents { get; set; }
    public List<AggregatedTopicDto> Topics { get; set; } = new();
}

public class AggregatedTopicDto
{
    public Guid TopicId { get; set; }
    public string Title { get; set; } = "";
    public int Sort { get; set; }
    public List<AggregatedCategoryDto> Categories { get; set; } = new();
    public List<AggregatedTextQuestionDto> TextQuestions { get; set; } = new();
}

public class AggregatedCategoryDto
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = "";
    public int Sort { get; set; }
    public List<AggregatedRatingQuestionDto> Questions { get; set; } = new();
}

public class AggregatedRatingQuestionDto
{
    public Guid QuestionId { get; set; }
    public string Content { get; set; } = "";
    public int Sort { get; set; }
    public int Score1Count { get; set; }
    public int Score2Count { get; set; }
    public int Score3Count { get; set; }
    public int Score4Count { get; set; }
    public int Score5Count { get; set; }
    public int Total { get; set; }
}

public class AggregatedTextQuestionDto
{
    public Guid TextQuestionId { get; set; }
    public string Content { get; set; } = "";
    public int Sort { get; set; }
    public List<AnswerFrequencyDto> Answers { get; set; } = new();
}

public class AnswerFrequencyDto
{
    public string Content { get; set; } = "";
    public int Frequency { get; set; }
}

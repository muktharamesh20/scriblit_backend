import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "Scriblink" + ".";

// Generic types for the concept's external dependencies
type Owner = ID;
type Item = ID;

// Internal entity types, represented as IDs
type Folder = ID;

/**
 * State: A set of Folders with an owner, title, contained set of Folders, and elements set of Items.
 */
interface FolderStructure {
  _id: Folder;
  author: Owner;
  title: string;
  folders: Folder[];
  elements: Item[];
}

/**
 * @concept Folder
 * @purpose To organize items hierarchically
 */
export default class LikertSurveyConcept {
  folders: Collection<FolderStructure>;
  elements: Collection<Item>;

  constructor(private readonly db: Db) {
    this.folders = this.db.collection(PREFIX + "folders");
    this.elements = this.db.collection(PREFIX + "elements");
  }

  /**
   * Action: Creates the initial root folder for a user.
   * @requires user has not created any other folders
   * @effects A new root folder associated with the user is created and its ID is returned.
   */
  async createRootFolder(
    { user }: {
      user: Owner;
    },
  ): Promise<{ folder: Folder } | { error: string }> {
    if (await this.folders.findOne({ author: user })) {
      return { error: "user has already created folders" };
    }

    const folderId = freshID() as Folder;
    await this.folders.insertOne({
      _id: folderId,
      author: user,
      title: "Root",
      folders: [],
      elements: [],
    });
    return { folder: folderId };
  }

  /**
   * Action: Adds a new question to an existing survey.
   * @requires The survey must exist.
   * @effects A new question is created and its ID is returned.
   */
  async addQuestion(
    { survey, text }: { survey: Survey; text: string },
  ): Promise<{ question: Question } | { error: string }> {
    const existingSurvey = await this.surveys.findOne({ _id: survey });
    if (!existingSurvey) {
      return { error: `Survey with ID ${survey} not found.` };
    }

    const questionId = freshID() as Question;
    await this.questions.insertOne({ _id: questionId, survey, text });
    return { question: questionId };
  }

  /**
   * Action: Submits a response to a question.
   * @requires The question must exist.
   * @requires The respondent must not have already responded to this question.
   * @requires The response value must be within the survey's defined scale.
   * @effects A new response is recorded in the state.
   */
  async submitResponse(
    { respondent, question, value }: {
      respondent: Respondent;
      question: Question;
      value: number;
    },
  ): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: `Question with ID ${question} not found.` };
    }

    const surveyDoc = await this.surveys.findOne({ _id: questionDoc.survey });
    if (!surveyDoc) {
      // This indicates a data integrity issue but is a good safeguard.
      return { error: "Associated survey for the question not found." };
    }

    if (value < surveyDoc.scaleMin || value > surveyDoc.scaleMax) {
      return {
        error:
          `Response value ${value} is outside the survey's scale [${surveyDoc.scaleMin}, ${surveyDoc.scaleMax}].`,
      };
    }

    const existingResponse = await this.responses.findOne({
      respondent,
      question,
    });
    if (existingResponse) {
      return {
        error:
          "Respondent has already answered this question. Use updateResponse to change it.",
      };
    }

    const responseId = freshID() as Response;
    await this.responses.insertOne({
      _id: responseId,
      respondent,
      question,
      value,
    });

    return {};
  }

  /**
   * Action: Updates an existing response to a question.
   * @requires The question must exist.
   * @requires A response from the given respondent to the question must already exist.
   * @requires The new response value must be within the survey's defined scale.
   * @effects The existing response's value is updated.
   */
  async updateResponse(
    { respondent, question, value }: {
      respondent: Respondent;
      question: Question;
      value: number;
    },
  ): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: `Question with ID ${question} not found.` };
    }

    const surveyDoc = await this.surveys.findOne({ _id: questionDoc.survey });
    if (!surveyDoc) {
      return { error: "Associated survey for the question not found." };
    }

    if (value < surveyDoc.scaleMin || value > surveyDoc.scaleMax) {
      return {
        error:
          `Response value ${value} is outside the survey's scale [${surveyDoc.scaleMin}, ${surveyDoc.scaleMax}].`,
      };
    }

    const result = await this.responses.updateOne({ respondent, question }, {
      $set: { value },
    });

    if (result.matchedCount === 0) {
      return {
        error:
          "No existing response found to update. Use submitResponse to create one.",
      };
    }

    return {};
  }

  /**
   * Query: Retrieves all questions associated with a specific survey.
   */
  async _getSurveyQuestions(
    { survey }: { survey: Survey },
  ): Promise<QuestionDoc[]> {
    return await this.questions.find({ survey }).toArray();
  }

  /**
   * Query: Retrieves all responses for a given survey. This involves finding all
   * questions for the survey first, then finding all responses to those questions.
   */
  async _getSurveyResponses(
    { survey }: { survey: Survey },
  ): Promise<ResponseDoc[]> {
    const surveyQuestions = await this.questions.find({ survey }).project({
      _id: 1,
    }).toArray();
    const questionIds = surveyQuestions.map((q) => q._id as Question);
    return await this.responses.find({ question: { $in: questionIds } })
      .toArray();
  }

  /**
   * Query: Retrieves all answers submitted by a specific respondent.
   */
  async _getRespondentAnswers(
    { respondent }: { respondent: Respondent },
  ): Promise<ResponseDoc[]> {
    return await this.responses.find({ respondent }).toArray();
  }
}
